"""캡처한 프레임을 CrazyGames 프리뷰 MP4로 인코딩한다.

사용: python3 -I scripts/encode-preview-video.py <프레임 폴더> <커버 PNG> <출력 MP4> <시작 프레임>
ffmpeg는 PATH 또는 FFMPEG 환경 변수의 실행 파일을 사용한다.
첫 3프레임(0.12초)은 커버, 이후 447프레임(17.88초)은 캡처한 실제 플레이다(25fps, 무음).
"""

import os
import shutil
import subprocess
import sys
import tempfile

FPS = 25
COVER_FRAMES = 3
GAMEPLAY_FRAMES = 447


def main() -> None:
    frames, cover, output, start = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
    ffmpeg = os.environ.get("FFMPEG") or shutil.which("ffmpeg")
    if not ffmpeg:
        sys.exit("ffmpeg not found; set FFMPEG")
    names = sorted(name for name in os.listdir(frames) if name.endswith(".png"))
    selected = names[start : start + GAMEPLAY_FRAMES]
    if len(selected) < GAMEPLAY_FRAMES:
        sys.exit(f"need {GAMEPLAY_FRAMES} frames from {start}, have {len(selected)}")
    first = os.path.join(frames, selected[0])
    size = subprocess.run(
        [ffmpeg, "-hide_banner", "-i", first],
        capture_output=True,
        text=True,
    ).stderr
    # 프레임과 같은 크기로 커버를 맞춘다(세로 커버 800×1200 → 1080×1620).
    width, height = (1920, 1080) if "1920x1080" in size else (1080, 1620)
    with tempfile.TemporaryDirectory() as work:
        cover_frame = os.path.join(work, "cover.png")
        subprocess.run(
            [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", cover,
             "-vf", f"scale={width}:{height}:flags=lanczos", cover_frame],
            check=True,
        )
        for index in range(COVER_FRAMES):
            os.symlink(cover_frame, os.path.join(work, f"{index:05d}.png"))
        for offset, name in enumerate(selected):
            os.symlink(
                os.path.abspath(os.path.join(frames, name)),
                os.path.join(work, f"{COVER_FRAMES + offset:05d}.png"),
            )
        subprocess.run(
            [ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
             "-framerate", str(FPS), "-i", os.path.join(work, "%05d.png"),
             "-c:v", "libx264", "-preset", "slow", "-crf", "18",
             "-profile:v", "high", "-pix_fmt", "yuv420p", "-an",
             "-movflags", "+faststart", output],
            check=True,
        )


if __name__ == "__main__":
    main()
