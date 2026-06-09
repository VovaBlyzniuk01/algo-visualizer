/**
 * Покроковий звіт для демонстрації процесу тестування в терміналі (дипломний проєкт).
 */
export function logStep(stepIndex, description, screenApi = null) {
  console.log(`\n── Крок ${stepIndex}: ${description} ──`);
  if (screenApi?.debug) {
    screenApi.debug(undefined, 30000);
  }
}

export function logTestResult(testIndex, title, status = 'OK') {
  const icon = status === 'OK' ? '✓' : '✗';
  console.log(`\n${icon} Тест ${testIndex}: ${title} -> Статус: ${status}`);
}

export function logSection(title) {
  console.log(`\n${'='.repeat(60)}\n  ${title}\n${'='.repeat(60)}`);
}
