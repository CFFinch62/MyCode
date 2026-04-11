' BEAM Two-Column Layout
win = beam_open(600, 400, "Settings")
vol = 50
dark_mode = 0

while beam_running(win)
  beam_begin(win)
    beam_row(200, 2)
      beam_group_begin("Audio")
        beam_label("Volume")
        vol = beam_slider(vol, 0, 100, 1, 180)
        beam_label("Level: " + str$(vol))
      beam_group_end()
      beam_group_begin("Display")
        dark_mode = beam_checkbox("Dark Mode", dark_mode)
        if beam_button("Apply", 80, 28) then
          if dark_mode then
            beam_set_style("dark")
          else
            beam_set_style("white")
          end if
        end if
      beam_group_end()
    beam_row_end()
  beam_end(win)
wend
