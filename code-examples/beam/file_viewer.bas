' ============================================================
' BEAM File Viewer
' Opens a text file via dialog and displays its contents
' inside a scrollable panel.  Supports re-opening a new file.
' ============================================================

win = beam_open(680, 500, "File Viewer")

filepath$  = ""
content$   = ""
line_count = 0
status$    = "No file loaded.  Click Open to choose a file."

' Read a text file into content$ (lines joined with \n)
sub load_file(path$)
  dim buf$(2000)
  line_count = 0
  content$ = ""
  open path$ for reading as #1
  while not eof(#1)
    line input #1, buf$(line_count)
    line_count = line_count + 1
    if line_count >= 2000 then
      ' cap at 2000 lines
      line_count = 2000
      goto done_reading
    end if
  wend
  label done_reading
  close #1
  ' build display string
  i = 0
  while i < line_count
    if content$ = "" then
      content$ = buf$(i)
    else
      content$ = content$ + "\n" + buf$(i)
    end if
    i = i + 1
  wend
  if line_count = 0 then
    content$ = "(empty file)"
    status$ = path$ + "  [0 lines]"
  else
    status$ = path$ + "  [" + str$(line_count) + " lines]"
  end if
end sub

while beam_running(win)
  beam_begin(win)

    ' --- Toolbar ---
    beam_row(30, 3)
      if beam_button("Open...", 90, 26) then
        p$ = beam_open_file("*.txt|*.bas|*.md|*.log|All text files")
        if p$ <> "" then
          filepath$ = p$
          load_file(filepath$)
        end if
      end if
      beam_label(status$)
      if beam_button("Close", 70, 26) then
        beam_close(win)
      end if
    beam_row_end()

    beam_separator()
    beam_spacing(4)

    ' --- Content panel (scrollable) ---
    if content$ = "" then
      beam_spacing(20)
      beam_label("Open a file to view its contents here.")
    else
      beam_panel_begin("Contents", 660, 420)
        beam_text(content$, 640, line_count * 16 + 40)
      beam_panel_end()
    end if

  beam_end(win)
wend
