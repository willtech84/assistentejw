-- Bucket privado para os PDFs de designação recebidos/gerados
insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', false)
on conflict (id) do nothing;

create policy "usuarios leem seus proprios pdfs"
  on storage.objects for select
  using (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "usuarios enviam seus proprios pdfs"
  on storage.objects for insert
  with check (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "usuarios apagam seus proprios pdfs"
  on storage.objects for delete
  using (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
