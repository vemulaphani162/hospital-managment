import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oetveaursxqpjowuxanv.supabase.co'  // From dashboard
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ldHZlYXVyc3hxcGpvd3V4YW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDg0NjUsImV4cCI6MjA4NjYyNDQ2NX0.GCX6BghWRCZ6Y_ObZMzxFHHJ1Ee20O0qYOVjZ8L3xns'                     // From dashboard

export const supabase = createClient(supabaseUrl, supabaseKey)
