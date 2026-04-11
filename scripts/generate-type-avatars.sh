#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${GEMINI_API_KEY:-}" ]]; then
  echo "GEMINI_API_KEY is required"
  exit 1
fi

SCRIPT_PATH=".agents/skills/internalkernel-agi-core-nano-banana-pro/scripts/generate_image.py"
OUT_DIR="public/type-avatars"
RESOLUTION="${1:-1K}"

if [[ ! -f "$SCRIPT_PATH" ]]; then
  echo "Skill script not found at $SCRIPT_PATH"
  exit 1
fi

mkdir -p "$OUT_DIR"
FAILED=()

generate() {
  local filename="$1"
  local prompt="$2"
  local output_path="$OUT_DIR/$filename"
  if [[ -f "$output_path" ]]; then
    echo "==> skipping $filename (already exists)"
    return 0
  fi

  local max_attempts=4
  local attempt=1
  while (( attempt <= max_attempts )); do
    echo "==> generating $filename (attempt $attempt/$max_attempts)"
    if uv run "$SCRIPT_PATH" --prompt "$prompt" --filename "$output_path" --resolution "$RESOLUTION"; then
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 2
  done

  echo "!! failed $filename after $max_attempts attempts"
  FAILED+=("$filename")
  return 0
}

generate "dog-boss.png" "MBTI style low-poly geometric mascot illustration, full body anthropomorphic dog team leader, confident commander pose with clipboard, navy and teal palette, angular shapes, clean white background, centered single character, flat shaded polygons, no text, no watermark, no logo"
generate "dog-show.png" "MBTI style low-poly geometric mascot illustration, full body anthropomorphic showman dog performer, energetic stage pose with handheld microphone and spotlight vibe, turquoise and mint palette, angular geometric body, clean white background, centered single character, no text, no watermark, no logo"
generate "dog-clng.png" "MBTI style low-poly geometric mascot illustration, full body anthropomorphic clingy companion dog, affectionate leaning pose with heart shaped collar tag, warm coral and cream palette, cute angular geometry, clean white background, centered single character, no text, no watermark, no logo"
generate "dog-guard.png" "MBTI style low-poly geometric mascot illustration, full body anthropomorphic guard dog, alert patrol stance with flashlight and badge icon, brown and steel blue palette, sharp triangular ears, clean white background, centered single character, no text, no watermark, no logo"
generate "dog-feel.png" "MBTI style low-poly geometric mascot illustration, full body anthropomorphic sensitive dog, gentle listening pose with oversized expressive ears, lavender and soft blue palette, geometric but soft expression, clean white background, centered single character, no text, no watermark, no logo"
generate "dog-sprk.png" "MBTI style low-poly geometric mascot illustration, full body anthropomorphic cheerful dog, lively jump pose with tiny confetti accents, yellow and orange palette, bright faceted polygons, clean white background, centered single character, no text, no watermark, no logo"
generate "dog-bffr.png" "MBTI style low-poly geometric mascot illustration, full body anthropomorphic social butterfly dog, welcoming open arms pose with subtle chat bubble motifs, green and cyan palette, friendly geometric style, clean white background, centered single character, no text, no watermark, no logo"
generate "dog-scnt.png" "MBTI style low-poly geometric mascot illustration, full body anthropomorphic detective hound dog, focused tracking pose with magnifier and scent trail curve, olive and amber palette, precise polygon details, clean white background, centered single character, no text, no watermark, no logo"
generate "dog-star.png" "MBTI style low-poly geometric mascot illustration, full body anthropomorphic prankster star dog, playful performance pose with juggling props, magenta and electric blue palette, dramatic faceted style, clean white background, centered single character, no text, no watermark, no logo"

generate "cat-jokr.png" "MBTI style low-poly geometric mascot illustration, full body anthropomorphic observer cat, calm side glance pose with tiny monocle and notebook, slate and mint palette, sharp polygon silhouette, clean white background, centered single character, no text, no watermark, no logo"
generate "cat-king.png" "MBTI style low-poly geometric mascot illustration, full body anthropomorphic authority cat, regal upright pose with small crown and scepter, emerald and gold palette, angular faceted body, clean white background, centered single character, no text, no watermark, no logo"
generate "cat-tsun.png" "MBTI style low-poly geometric mascot illustration, full body anthropomorphic tsundere cat, crossed arms aloof pose with subtle blush, pink and gray palette, crisp polygon edges, clean white background, centered single character, no text, no watermark, no logo"
generate "cat-nite.png" "MBTI style low-poly geometric mascot illustration, full body anthropomorphic night wanderer cat, stealthy tiptoe pose with crescent moon lantern, indigo and cyan palette, geometric nocturnal style, clean white background, centered single character, no text, no watermark, no logo"
generate "cat-muse.png" "MBTI style low-poly geometric mascot illustration, full body anthropomorphic philosopher cat, thoughtful seated pose on a box with light ray accent, sage and aqua palette, introspective faceted style, clean white background, centered single character, no text, no watermark, no logo"
generate "cat-jury.png" "MBTI style low-poly geometric mascot illustration, full body anthropomorphic judge cat, strict evaluation pose with gavel, charcoal and burgundy palette, angular dignified design, clean white background, centered single character, no text, no watermark, no logo"
generate "cat-ghst.png" "MBTI style low-poly geometric mascot illustration, full body anthropomorphic drifting cat, light floating step pose with scarf trail, pale teal and silver palette, airy geometric style, clean white background, centered single character, no text, no watermark, no logo"
generate "cat-noir.png" "MBTI style low-poly geometric mascot illustration, full body anthropomorphic melancholic cat, quiet reflective pose with small raincoat detail, deep blue and plum palette, moody polygon styling, clean white background, centered single character, no text, no watermark, no logo"
generate "cat-diva.png" "MBTI style low-poly geometric mascot illustration, full body anthropomorphic camera diva cat, glamorous runway pose with spotlight glint, gold and violet palette, stylish faceted character design, clean white background, centered single character, no text, no watermark, no logo"

if (( ${#FAILED[@]} > 0 )); then
  echo "Some files failed:"
  printf ' - %s\n' "${FAILED[@]}"
  exit 1
fi

echo "All avatar generations finished."
