import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { AlgorithmCard, default as Hub } from './Hub';
import { algorithmsData } from '../../data/algorithmsData';
import { LanguageProvider } from '../../context/LanguageContext';
import { logStep, logTestResult, logSection } from '../../test-utils/stepReporter';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/** Мінімальне превʼю для ізольованого тесту карточки без важких анімацій */
function MockPreview({ accent }) {
  return <div data-testid="card-preview">preview:{accent}</div>;
}

const sampleAlgorithm = {
  id: 'sorting',
  title: { en: 'Sorting Algorithms', ua: 'Алгоритми сортування' },
  preview: MockPreview,
  route: '/sorting',
  status: 'active',
  accent: {
    key: 'cyan',
    hex: '#00d2ff',
    glow: 'rgba(0, 210, 255, 0.34)',
    softGlow: 'rgba(0, 210, 255, 0.16)',
  },
};

function renderWithProviders(ui) {
  return render(
    <MemoryRouter>
      <LanguageProvider>{ui}</LanguageProvider>
    </MemoryRouter>
  );
}

describe('AlgorithmCard — комплексне тестування UI карточки', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    logSection('Модуль: AlgorithmCard (окрема карточка алгоритму)');
  });

  // Тест 1: перевіряємо, що заголовок, id та превʼю відображаються згідно з пропсами
  it('відображає дані алгоритму (заголовок, id, превʼю)', () => {
    logStep(1, 'Монтування карточки з тестовими пропсами (ua)', screen);

    render(
      <AlgorithmCard
        algorithm={sampleAlgorithm}
        language="ua"
        openLabel="Відкрити модуль"
        previewLabel="Live Preview"
        navigate={mockNavigate}
      />
    );

    logStep(2, 'Перевірка наявності id модуля та українського заголовка', screen);

    expect(screen.getByText('sorting')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Алгоритми сортування');
    expect(screen.getByTestId('card-preview')).toHaveTextContent('preview:#00d2ff');

    logStep(3, 'Фінальний DOM після асертів рендерингу', screen);
    logTestResult(1, 'Рендеринг карточки');
  });

  // Тест 2: кнопка «Відкрити модуль» викликає navigate з коректним маршрутом
  it('реагує на клік по кнопці відкриття модуля', () => {
    logStep(1, 'Рендер карточки перед взаємодією', screen);

    render(
      <AlgorithmCard
        algorithm={sampleAlgorithm}
        language="en"
        openLabel="Open Module"
        previewLabel="Live Preview"
        navigate={mockNavigate}
      />
    );

    const openButton = screen.getByRole('button', { name: /Open Module/i });
    logStep(2, 'Кнопка знайдена — симулюємо клік користувача', screen);

    fireEvent.click(openButton);

    logStep(3, 'DOM після кліку; перевіряємо виклик navigate', screen);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/sorting');

    logTestResult(2, 'Інтерактивність кнопки карточки');
  });
});

describe('Hub — список карточок та перемикач мови', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    logSection('Модуль: Hub (сітка карточок + вибір мови)');
  });

  // Тест 3: Hub рендерить усі карточки з algorithmsData
  it('рендерить сітку з усіма карточками алгоритмів', () => {
    logStep(1, 'Монтування Hub з LanguageProvider та Router', screen);

    renderWithProviders(<Hub />);

    logStep(2, 'Підрахунок article-елементів (карточок) у DOM', screen);

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(algorithmsData.length);

    const firstAlgo = algorithmsData[0];
    expect(
      within(cards[0]).getByRole('heading', { level: 2 })
    ).toHaveTextContent(firstAlgo.title.ua);

    logStep(3, 'Перша карточка містить очікуваний заголовок (мова UA за замовчуванням)', screen);
    logTestResult(3, 'Рендеринг списку карточок');
  });

  // Тест 4: перемикач EN змінює текст заголовка карточки (реакція на вибір мови)
  it('перемикає мову інтерфейсу через кнопки UA / EN', () => {
    logStep(1, 'Hub у режимі UA (дефолт контексту)', screen);

    renderWithProviders(<Hub />);

    const cardsBefore = screen.getAllByRole('article');
    const titleBefore = within(cardsBefore[0]).getByRole('heading', { level: 2 }).textContent;

    logStep(2, 'Клік по кнопці EN — очікуємо зміну локалізації заголовків', screen);
    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    logStep(3, 'DOM після перемикання мови', screen);

    const titleAfter = within(screen.getAllByRole('article')[0]).getByRole('heading', {
      level: 2,
    }).textContent;

    expect(titleBefore).toBe(algorithmsData[0].title.ua);
    expect(titleAfter).toBe(algorithmsData[0].title.en);
    expect(titleBefore).not.toBe(titleAfter);

    logTestResult(4, 'Перемикач мови (інтерактивний вибір)');
  });
});
