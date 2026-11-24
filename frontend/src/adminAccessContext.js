import { createContext } from 'react';

// React context reaches native dialogs rendered through a body portal too.
export const AdminAccessLockContext = createContext(false);
