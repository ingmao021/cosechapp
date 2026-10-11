#!/usr/bin/env node
/**
 * Hook: SessionStart
 *
 * Inyecta automaticamente el contenido de wiki/AI-Harness.md como contexto
 * en CADA sesion de Claude Code (inicio normal, /clear, /resume y despues
 * de compactar contexto) para que las reglas del harness apliquen siempre,
 * sin tener que pegarlas a mano al arrancar cada tarea.
 *
 * Ruta esperada del harness: wiki/AI-Harness.md (relativa a la raiz del
 * proyecto). Si moviste el archivo a otra ruta, actualiza HARNESS_PATH.
 */

const fs = require("fs");
const path = require("path");

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const HARNESS_PATH = path.join(PROJECT_DIR, "wiki", "AI-Harness.md");

// additionalContext tiene un limite documentado de 10000 caracteres.
// Se deja margen de seguridad por si el archivo crece.
const MAX_CHARS = 9500;

function main() {
  if (!fs.existsSync(HARNESS_PATH)) {
    // No bloquea el inicio de sesion si el archivo no existe todavia;
    // simplemente no inyecta nada.
    process.exit(0);
  }

  let content;
  try {
    content = fs.readFileSync(HARNESS_PATH, "utf8");
  } catch (err) {
    process.exit(0);
  }

  let truncatedNotice = "";
  if (content.length > MAX_CHARS) {
    content = content.slice(0, MAX_CHARS);
    truncatedNotice =
      "\n\n[AVISO: wiki/AI-Harness.md fue truncado por el limite de " +
      "additionalContext (10000 caracteres). Lee el archivo completo si " +
      "necesitas una seccion que no aparecio arriba.]";
  }

  const output = {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext:
        "Reglas obligatorias de ejecucion del proyecto CosechApp " +
        "(cargadas automaticamente desde wiki/AI-Harness.md por un hook " +
        "de SessionStart — no hace falta pegarlas a mano en cada tarea). " +
        "Estas reglas aplican a toda la sesion, sin excepcion:\n\n" +
        content +
        truncatedNotice,
    },
  };

  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

main();
