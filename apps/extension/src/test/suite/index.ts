import * as path from "node:path";
import Mocha from "mocha";
import { glob } from "glob";

export function run(): Promise<void> {
  const mocha = new Mocha({ ui: "tdd", color: true, timeout: 60000 });
  const testsRoot = path.resolve(__dirname, "..");

  return new Promise((resolve, reject) => {
    glob("**/**.test.js", { cwd: testsRoot })
      .then((files) => {
        for (const f of files) mocha.addFile(path.resolve(testsRoot, f));
        try {
          mocha.run((failures: number) => {
            if (failures > 0) reject(new Error(`${failures} testes falharam.`));
            else resolve();
          });
        } catch (err) {
          reject(err);
        }
      })
      .catch(reject);
  });
}
