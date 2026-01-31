import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = () => {
    return true; // LUÔN CHO PHÉP TRUY CẬP
};
