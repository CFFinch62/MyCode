' BEAM Input Form Example
win = beam_open(500, 300, "User Info")
name$ = ""
result$ = ""

while beam_running(win)
  beam_begin(win)
    beam_group_begin("Enter Details")
      beam_label("Your name:")
      beam_row(30, 1)
        if beam_input(name$, 64, 300) then
          result$ = "Hello, " + name$ + "!"
        end if
      beam_row_end()
      beam_spacing(8)
      if beam_button("Submit", 100, 30) then
        r = beam_msgbox("Result", result$)
      end if
    beam_group_end()
  beam_end(win)
wend
