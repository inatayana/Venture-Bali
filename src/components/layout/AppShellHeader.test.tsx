import { render, fireEvent } from '@testing-library/react';
import { AppShellHeader } from './AppShellHeader';

const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock('@/components/layout/DesktopNavMenu', () => ({
  DesktopNavMenu: () => <div data-testid="desktop-nav" />,
}));

beforeEach(() => {
  mockBack.mockReset();
});

describe('AppShellHeader', () => {
  it('offers a back action and a home link on app-shell pages', () => {
    const { getByLabelText, getByText, getByTestId } = render(<AppShellHeader title="Explore" />);

    expect(getByText('Explore')).toBeTruthy();
    expect(getByLabelText('Go back')).toBeTruthy();
    expect(getByLabelText('Home').getAttribute('href')).toBe('/');
    expect(getByTestId('desktop-nav')).toBeTruthy();
  });

  it('navigates back when the back button is pressed', () => {
    const { getByLabelText } = render(<AppShellHeader title="Profile" />);
    fireEvent.click(getByLabelText('Go back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
