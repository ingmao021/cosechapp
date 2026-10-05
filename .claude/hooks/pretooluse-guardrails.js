#!/usr/bin/env node
/**
 * Hook: PreToolUse (matcher: "Bash")
 *
 * Refuerza de forma MECANICA las secciones 2.1 y 2.6 de AI-Harness.md:
 * ningun comando destructivo o irreversible (borrar archivos/ramas,
 * forzar push, resetear la base de datos, etc.) se ejecuta sin que el
 * usuario lo confirme explicitamente, incluso si Bash ya esta
 * auto-aprobado en esta sesion.
 *
 * No bloquea de forma definitiva (no usa exit 2): en vez de eso devuelve
 * permissionDecision "ask", que obliga a pasar por el dialogo de permiso
 * de Claude Code para ese comando puntual. Si el comando no coincide con
 * ningun patron, no hace nada y el flujo normal de permisos sigue igual.
 *
 * Ajusta DANGEROUS_PATTERNS si tu flujo de trabajo necesita cubrir mas
 * casos (por ejemplo, comandos propios de despliegue).
 */

const DANGEROUS_PATTERNS = [
  { re: /\brm\s+(-\w*r\w*f\w*|-\w*f\w*r\w*)\b/i, label: "rm -rf / rm -fr" },
  { re: /git\s+push\s+[^\n]*(--force|-f)\b/i, label: "git push --force" },
  { re: /git\s+reset\s+--hard/i, label: "git reset --hard" },
  { re: /git\s+branch\s+-D\b/i, label: "git branch -D (borrado forzado)" },
  { re: /git\s+clean\s+[^\n]*-f/i, label: "git clean -f" },
  { re: /\b(drop|truncate)\s+(table|database)\b/i, label: "DROP/TRUNCATE" },
  { re: /\bdropdb\b|\bdrop\s+schema\b/i, label: "dropdb / drop schema" },
  { re: /neon\s+(branches|projects)\s+delete/i, label: "neon ... delete" },
  { re: /prisma\s+migrate\s+reset/i, label: "prisma migrate reset" },
  { re: /\bgit\s+push\s+[^\n]*origin\s+main\b.*--force/i, label: "force push a main" },
];

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    // Por si no hay stdin (poco probable en PreToolUse), evita colgar el hook.
    setTimeout(() => resolve(data), 5000);
  });
}

async function main() {
  const raw = await readStdin();

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    process.exit(0); // input no parseable: no interferir, flujo normal.
  }

  const command = (payload && payload.tool_input && payload.tool_input.command) || "";
  if (!command) {
    process.exit(0);
  }

  const hit = DANGEROUS_PATTERNS.find((p) => p.re.test(command));
  if (!hit) {
    process.exit(0);
  }

  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason:
        `AI-Harness.md §2.1/§2.6: comando detectado como destructivo o ` +
        `irreversible (${hit.label}). Requiere tu confirmacion explicita antes ` +
        `de ejecutarse, aunque Bash ya este auto-aprobado.`,
    },
  };

  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

main();
