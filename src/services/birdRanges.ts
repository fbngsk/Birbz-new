-- RLS aktivieren
ALTER TABLE bird_sightings ENABLE ROW LEVEL SECURITY;

-- Policy: Lesen (letzte 7 Tage, nicht geflaggt)
CREATE POLICY "Public can view recent sightings" ON bird_sightings
  FOR SELECT
  USING (
    flagged = FALSE 
    AND sighted_at >= CURRENT_DATE - INTERVAL '7 days'
  );

-- Policy: Einfügen (nur eigene)
CREATE POLICY "Users can insert own sightings" ON bird_sightings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Löschen (nur eigene)
CREATE POLICY "Users can delete own sightings" ON bird_sightings
  FOR DELETE
  USING (auth.uid() = user_id);
