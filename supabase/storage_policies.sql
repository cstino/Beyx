
-- Policy RLS per il bucket storage 'parts-images'
-- Questo permette agli utenti autenticati (admin) di caricare nuove immagini
-- e a chiunque di visualizzarle (essendo un bucket pubblico)

DO $$
BEGIN
    -- Policy per l'inserimento (Upload)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Permetti upload parti ad autenticati'
    ) THEN
        CREATE POLICY "Permetti upload parti ad autenticati" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'parts-images');
    END IF;

    -- Policy per la selezione (Download/View)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Permetti visione pubblica parti'
    ) THEN
        CREATE POLICY "Permetti visione pubblica parti" ON storage.objects
        FOR SELECT TO public
        USING (bucket_id = 'parts-images');
    END IF;

    -- Policy per l'aggiornamento (Update)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Permetti update parti ad autenticati'
    ) THEN
        CREATE POLICY "Permetti update parti ad autenticati" ON storage.objects
        FOR UPDATE TO authenticated
        USING (bucket_id = 'parts-images');
    END IF;

    -- Policy per la cancellazione (Delete)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Permetti delete parti ad autenticati'
    ) THEN
        CREATE POLICY "Permetti delete parti ad autenticati" ON storage.objects
        FOR DELETE TO authenticated
        USING (bucket_id = 'parts-images');
    END IF;
END $$;
