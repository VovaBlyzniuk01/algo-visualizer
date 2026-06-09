/**
 * Додатковий звіт після кожного тест-файлу — доповнює console.log у самих тестах.
 */
class DiplomaStepReporter {
  onTestFileResult(_test, testResult) {
    const passed = testResult.numPassingTests;
    const failed = testResult.numFailingTests;
    const total = passed + failed;

    console.log(
      `\n[Звіт файлу] ${testResult.testFilePath.split(/[/\\]/).pop()} — пройдено ${passed}/${total}`
    );
  }

  onRunComplete(_contexts, results) {
    const { numPassedTests = 0, numFailedTests = 0 } = results || {};

    console.log(
      `\n${'═'.repeat(60)}\n  Підсумок комплексного тестування: ${numPassedTests} успішних, ${numFailedTests} невдалих\n${'═'.repeat(60)}\n`
    );
  }
}

module.exports = DiplomaStepReporter;
