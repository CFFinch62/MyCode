// ============================================================
// BEAM Two Windows
// Opens two independent windows side by side.
// Each window has its own counter and controls.
// "Send" copies your counter value into the other window.
// Either window can be closed independently; the program
// exits when both are closed.
// ============================================================

win1 = beam_open(340, 280, "Window One")
win2 = beam_open(340, 280, "Window Two")

count1 = 0
count2 = 0
msg1$  = "Click the buttons below."
msg2$  = "Click the buttons below."

// Run until both windows are closed
while beam_running(win1) or beam_running(win2)

  // --- Window 1 ---
  if beam_running(win1) then
    beam_begin(win1)

      beam_group_begin("Counter A")
        beam_label("Value: " + str$(count1))
        beam_spacing(8)
        beam_row(30, 3)
          if beam_button("-1", 60, 26) then
            count1 = count1 - 1
            msg1$ = "Decremented to " + str$(count1)
          end if
          if beam_button("+1", 60, 26) then
            count1 = count1 + 1
            msg1$ = "Incremented to " + str$(count1)
          end if
          if beam_button("Reset", 70, 26) then
            count1 = 0
            msg1$ = "Counter reset."
          end if
        beam_row_end()
        beam_spacing(6)
        beam_label(msg1$)
      beam_group_end()

      beam_spacing(8)

      if beam_button("Send to Win 2", 140, 28) then
        count2 = count1
        msg2$ = "Win 1 sent: " + str$(count1)
      end if

      beam_spacing(6)

      if beam_button("Close This Window", 160, 28) then
        beam_close(win1)
      end if

    beam_end(win1)
  end if

  // --- Window 2 ---
  if beam_running(win2) then
    beam_begin(win2)

      beam_group_begin("Counter B")
        beam_label("Value: " + str$(count2))
        beam_spacing(8)
        beam_row(30, 3)
          if beam_button("-1", 60, 26) then
            count2 = count2 - 1
            msg2$ = "Decremented to " + str$(count2)
          end if
          if beam_button("+1", 60, 26) then
            count2 = count2 + 1
            msg2$ = "Incremented to " + str$(count2)
          end if
          if beam_button("Reset", 70, 26) then
            count2 = 0
            msg2$ = "Counter reset."
          end if
        beam_row_end()
        beam_spacing(6)
        beam_label(msg2$)
      beam_group_end()

      beam_spacing(8)

      if beam_button("Send to Win 1", 140, 28) then
        count1 = count2
        msg1$ = "Win 2 sent: " + str$(count2)
      end if

      beam_spacing(6)

      if beam_button("Close This Window", 160, 28) then
        beam_close(win2)
      end if

    beam_end(win2)
  end if

wend
