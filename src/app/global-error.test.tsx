import { renderToStaticMarkup } from 'react-dom/server';
import GlobalError from './global-error';

describe('GlobalError', () => {
  it('renders its own document shell and never leaks the raw error', () => {
    const html = renderToStaticMarkup(
      <GlobalError
        error={Object.assign(new Error('database password leaked'), {
          digest: 'global-123',
        })}
        reset={() => {}}
      />,
    );

    expect(html).toContain('<html');
    expect(html).toContain('<body');
    expect(html).toContain('BaliWild hit a problem');
    expect(html).toContain('global-123');
    expect(html).not.toContain('database password leaked');
  });
});
