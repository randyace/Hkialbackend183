import type { ReactNode } from 'react';

type GenericProps = Record<string, unknown> & { children?: ReactNode };

export default function AccountCreationView(props: GenericProps) {
  void props;
  return null;
}
