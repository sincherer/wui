import { atom, useAtomValue } from "jotai";

export const currentPageAtom = atom<Page | null>(null);

import { Page } from '../../__dev/PageManagementPanel';

export const useCurrentPage = (): Page | null => {
  const currentPage = useAtomValue(currentPageAtom);
  return currentPage;
};
