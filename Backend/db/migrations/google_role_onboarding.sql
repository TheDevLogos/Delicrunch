-- Cuentas existentes ya conservaron el tipo elegido al registrarse.
-- Las cuentas Google nuevas se insertan con NULL para pedirlo una sola vez.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role_selected_at TIMESTAMPTZ DEFAULT NOW();
