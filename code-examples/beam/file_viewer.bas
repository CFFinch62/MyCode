// ============================================================
// BEAM File Viewer
// Opens a text file via dialog and displays its contents
// inside a scrollable panel.  Supports re-opening a new file.
// Uses system$("cat ...") to read file content since yabasic
// does not have a line-by-line file-read statement.
// ============================================================

win = beam_open(680, 500, "File Viewer")

filepath$  = ""
content$   = ""
status$    = "No file loaded.  Click Open to choose a file."

sub load_file(path$)
  content$ = system$("cat " + path$)
  if content$ = "" then
    status$ = path$ + "  [empty]"
  else
    status$ = path$
  end if
end sub

while beam_running(win)
  beam_begin(win)

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

    if content$ = "" then
      beam_spacing(20)
      beam_label("Open a file to view its contents here.")
    else
      beam_panel_begin("Contents", 660, 420)
        beam_text(content$, 640, 2000)
      beam_panel_end()
    end if

  beam_end(win)
wend
