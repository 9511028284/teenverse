begin;

create or replace function public.validate_opportunity_application_update()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  caller_id uuid := auth.uid();
  owner_id uuid;
begin
  if new.opportunity_id is distinct from old.opportunity_id
     or new.applicant_id is distinct from old.applicant_id
     or new.cover_letter is distinct from old.cover_letter
     or new.resume_file_id is distinct from old.resume_file_id then
    raise exception 'Application identity and submitted materials are immutable';
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  if public.is_admin(caller_id) then
    return new;
  end if;

  if caller_id = old.applicant_id then
    if old.status not in ('applied', 'shortlisted') or new.status <> 'withdrawn' then
      raise exception 'Applicant cannot make this status transition';
    end if;
    return new;
  end if;

  select o.business_id into owner_id
  from public.opportunities o
  where o.id = old.opportunity_id;

  if caller_id is distinct from owner_id then
    raise exception 'Only the applicant, owning business, or an admin can update this application';
  end if;

  if not (
    (old.status = 'applied' and new.status in ('shortlisted', 'selected', 'rejected'))
    or (old.status = 'shortlisted' and new.status in ('selected', 'rejected'))
    or (old.status = 'selected' and new.status in ('rejected', 'completed'))
  ) then
    raise exception 'Business cannot make this status transition';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_opportunity_application_update_trigger
on public.opportunity_applications;

create trigger validate_opportunity_application_update_trigger
before update on public.opportunity_applications
for each row
execute function public.validate_opportunity_application_update();

create or replace function public.log_opportunity_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.application_status_history (
      application_id,
      old_status,
      new_status,
      changed_by,
      note
    ) values (
      new.id,
      null,
      new.status,
      coalesce(auth.uid(), new.applicant_id),
      'Application submitted'
    );
  elsif new.status is distinct from old.status then
    insert into public.application_status_history (
      application_id,
      old_status,
      new_status,
      changed_by,
      note
    ) values (
      new.id,
      old.status,
      new.status,
      auth.uid(),
      case
        when new.status = 'rejected' then coalesce(new.rejection_reason, 'Application rejected')
        when new.status = 'withdrawn' then 'Application withdrawn'
        else coalesce(new.business_note, 'Status changed to ' || new.status)
      end
    );
  end if;

  return new;
end;
$$;

drop trigger if exists log_opportunity_application_status_insert_trigger
on public.opportunity_applications;

create trigger log_opportunity_application_status_insert_trigger
after insert on public.opportunity_applications
for each row
execute function public.log_opportunity_application_status_change();

commit;
