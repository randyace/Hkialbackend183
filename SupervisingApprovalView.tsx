import type { ReactNode } from 'react';

type GenericProps = Record<string, unknown> & { children?: ReactNode };

export default function SupervisingApprovalView(props: GenericProps) {
  void props;
  return null;
}
