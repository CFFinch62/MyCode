' ============================================================
' BEAM Color Picker
' Three sliders control R, G, B (0-255 each).
' The preview section shows the hex code and calls
' beam_set_color to tint the Nuklear UI accent color live.
' ============================================================

win = beam_open(460, 360, "Color Picker")

r_val = 100
g_val = 150
b_val = 200

' Convert an integer 0-255 to a two-digit hex string
sub byte_to_hex$(n)
  digits$ = "0123456789ABCDEF"
  hi = int(n / 16)
  lo = n - hi * 16
  byte_to_hex$ = mid$(digits$, hi + 1, 1) + mid$(digits$, lo + 1, 1)
end sub

while beam_running(win)
  beam_begin(win)

    beam_group_begin("RGB Sliders")

      beam_row(28, 2)
        beam_label("Red:   " + str$(int(r_val)))
        r_val = beam_slider(r_val, 0, 255, 1, 280)
      beam_row_end()

      beam_row(28, 2)
        beam_label("Green: " + str$(int(g_val)))
        g_val = beam_slider(g_val, 0, 255, 1, 280)
      beam_row_end()

      beam_row(28, 2)
        beam_label("Blue:  " + str$(int(b_val)))
        b_val = beam_slider(b_val, 0, 255, 1, 280)
      beam_row_end()

    beam_group_end()

    beam_spacing(8)

    beam_group_begin("Preview")

      hex$ = "#" + byte_to_hex$(int(r_val)) + byte_to_hex$(int(g_val)) + byte_to_hex$(int(b_val))
      beam_label("Hex: " + hex$)
      beam_label("RGB: " + str$(int(r_val)) + ", " + str$(int(g_val)) + ", " + str$(int(b_val)))

      beam_spacing(8)

      beam_row(30, 2)
        if beam_button("Apply Color", 120, 26) then
          beam_set_color(int(r_val), int(g_val), int(b_val))
        end if
        if beam_button("Reset", 80, 26) then
          r_val = 100
          g_val = 150
          b_val = 200
          beam_set_style("dark")
        end if
      beam_row_end()

      beam_spacing(6)
      beam_label("(Apply Color tints the UI accent colour)")

    beam_group_end()

    beam_spacing(6)

    if beam_button("Close", 80, 28) then
      beam_close(win)
    end if

  beam_end(win)
wend
