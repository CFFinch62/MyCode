// ============================================================
// BEAM Progress Bar Demo
// Demonstrates an animated progress bar that fills over time.
// Start / Stop control the animation.  Reset clears the bar.
// Speed slider controls how fast the bar advances each frame.
// ============================================================

win = beam_open(500, 280, "Progress Demo")

running   = 0
value     = 0
maxval    = 100
speed     = 2
last_t    = 0
elapsed$  = "0 ms"

while beam_running(win)
  beam_begin(win)

    beam_group_begin("Animated Progress Bar")

      // Progress bar display
      beam_spacing(8)
      beam_progress(value, maxval, 440, 30)
      beam_label(str$(value) + " / " + str$(maxval))
      beam_spacing(8)

      // Control buttons
      beam_row(32, 4)
        if running then
          if beam_button("Stop", 80, 28) then
            running = 0
          end if
        else
          if beam_button("Start", 80, 28) then
            running = 1
            last_t = beam_time()
          end if
        end if

        if beam_button("Reset", 80, 28) then
          value   = 0
          running = 0
          elapsed$ = "0 ms"
        end if

        if beam_button("Fill", 80, 28) then
          value   = maxval
          running = 0
        end if

        beam_label(elapsed$)
      beam_row_end()

      beam_spacing(10)
      beam_separator()
      beam_spacing(6)

      // Speed control
      beam_label("Speed (units / frame):")
      speed = beam_slider(speed, 1, 20, 1, 440)
      beam_label("Speed: " + str$(speed))

    beam_group_end()

  beam_end(win)

  // Advance the bar outside the frame to avoid stalling Nuklear
  if running then
    now = beam_time()
    if now - last_t >= 16 then
      value = value + speed
      if value >= maxval then
        value   = maxval
        running = 0
      end if
      elapsed$ = str$(int(now)) + " ms"
      last_t = now
    end if
  end if

wend
