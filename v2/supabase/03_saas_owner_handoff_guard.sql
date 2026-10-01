-- El usuario histórico creado durante las pruebas no debe conservar privilegios
-- de administrador SaaS mientras los datos esperan a ser vinculados por Migue.
-- El identificador del propietario histórico permanece en saas_system_state para
-- que claim_legacy_owner() pueda mover los datos de forma controlada tras validar
-- el PIN actual de Migue.

update public.perfiles p
set role = 'coach', updated_at = now()
from public.saas_system_state s
where s.id = 'singleton'
  and s.owner_claimed_by is null
  and p.id = s.legacy_owner_id
  and p.role = 'owner';
