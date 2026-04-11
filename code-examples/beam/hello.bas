' BEAM Hello World
win = beam_open(400, 200, "Hello BEAM")

while beam_running(win)
  beam_begin(win)
    beam_label("Hello, World!")
    beam_spacing(10)
    if beam_button("Close", 80, 30) then
      beam_close(win)
    end if
  beam_end(win)
wend
