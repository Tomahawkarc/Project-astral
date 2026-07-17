from pathlib import Path
import re
import shutil
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
errors = []
required = [root / "mod.hjson", root / "scripts" / "main.js"]

for path in required:
    if not path.exists():
        errors.append(f"Missing required file: {path.relative_to(root)}")

scripts = sorted((root / "scripts").rglob("*.js"))
require_pattern = re.compile(r'require\("([a-zA-Z0-9_./-]+)"\)')

for path in scripts:
    text = path.read_text(encoding="utf-8")
    meaningful = [line.strip() for line in text.splitlines() if line.strip()]

    if not meaningful or meaningful[0] != '"use strict";':
        errors.append(f"{path.relative_to(root)} must start with a strict directive")

    if "//" in text:
        errors.append(f"{path.relative_to(root)} contains a forbidden line comment")

    for module in require_pattern.findall(text):
        target = root / "scripts" / f"{module}.js"
        if not target.exists():
            errors.append(f"{path.relative_to(root)} requires missing module {module}")

metadata = (root / "mod.hjson").read_text(encoding="utf-8") if (root / "mod.hjson").exists() else ""
metadata_rules = {
    r"(?m)^name:\s*project-astral\s*$": "metadata name must stay stable",
    r"(?m)^minGameVersion:\s*159\.6\s*$": "minimum game version must be 159.6",
    r"(?m)^java:\s*false\s*$": "the project must remain a script mod",
    r"(?m)^iosCompatible:\s*false\s*$": "JavaAdapter content cannot claim iOS compatibility"
}

for pattern, message in metadata_rules.items():
    if re.search(pattern, metadata) is None:
        errors.append(message)

node = shutil.which("node")
if node is not None:
    for path in scripts:
        result = subprocess.run([node, "--check", str(path)], capture_output=True, text=True)
        if result.returncode != 0:
            errors.append(f"JavaScript syntax failed for {path.relative_to(root)}: {result.stderr.strip()}")

for bundle in sorted((root / "bundles").glob("bundle*.properties")):
    seen = set()
    for number, line in enumerate(bundle.read_text(encoding="utf-8").splitlines(), 1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        key = stripped.split("=", 1)[0].strip()
        if key in seen:
            errors.append(f"Duplicate bundle key {key} in {bundle.name}:{number}")
        seen.add(key)

if errors:
    for error in errors:
        print(f"ERROR: {error}")
    sys.exit(1)

print(f"Validated {len(scripts)} JavaScript modules for Mindustry build 159.6.")
