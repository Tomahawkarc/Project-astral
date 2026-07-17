from pathlib import Path
import argparse
import zipfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--output", default="artifacts/project-astral.zip")
args = parser.parse_args()
output = root / args.output
output.parent.mkdir(parents=True, exist_ok=True)

files = [root / "mod.hjson"]
for directory in ["scripts", "bundles", "content", "sprites", "maps", "sounds", "music", "schematics"]:
    source = root / directory
    if source.exists():
        files.extend(path for path in source.rglob("*") if path.is_file())

with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for path in sorted(files):
        archive.write(path, path.relative_to(root).as_posix())

print(output)
