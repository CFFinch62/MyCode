// ============================================================
// BEAM Style Demo
// Shows all three built-in Nuklear themes: dark, white, amber.
// Demonstrates representative widgets under each theme so
// you can compare the look and feel before choosing one for
// your own application.
// ============================================================

win = beam_open(540, 480, "Style Demo")

current_style$ = "dark"
beam_set_style("dark")

slider_val  = 60
checkbox_val = 1
combo_sel   = 0
combo_items$ = "Option A\nOption B\nOption C\nOption D"
input_buf$  = "sample text"

while beam_running(win)
  beam_begin(win)

    // --- Theme selector ---
    beam_group_begin("Choose Theme")
      beam_row(32, 3)
        if beam_button("Dark", 100, 28) then
          beam_set_style("dark")
          current_style$ = "dark"
        end if
        if beam_button("White", 100, 28) then
          beam_set_style("white")
          current_style$ = "white"
        end if
        if beam_button("Amber", 100, 28) then
          beam_set_style("amber")
          current_style$ = "amber"
        end if
      beam_row_end()
      beam_label("Active theme: " + current_style$)
    beam_group_end()

    beam_spacing(8)

    // --- Widget preview ---
    beam_group_begin("Widget Preview")

      beam_label("Label text looks like this.")
      beam_spacing(4)

      beam_row(28, 2)
        beam_label("Text input:")
        r = beam_input(input_buf$, 64, 200)
      beam_row_end()

      beam_spacing(4)
      checkbox_val = beam_checkbox("Checkbox (toggle me)", checkbox_val)
      beam_spacing(4)

      beam_label("Slider:")
      slider_val = beam_slider(slider_val, 0, 100, 1, 460)
      beam_label("Value: " + str$(int(slider_val)))
      beam_spacing(4)

      beam_label("Combo:")
      combo_sel = beam_combo(combo_items$, 4, combo_sel, 200, 26)
      beam_label("Selected: " + str$(combo_sel))
      beam_spacing(4)

      beam_progress(int(slider_val), 100, 460, 20)
      beam_spacing(4)

      beam_separator()
      beam_spacing(4)

      beam_row(30, 3)
        if beam_button("Primary", 110, 26) then
          r = beam_msgbox("Button", "Primary button pressed under " + current_style$ + " theme.")
        end if
        if beam_button("Secondary", 110, 26) then
          r = beam_msgbox("Button", "Secondary button pressed.")
        end if
        if beam_button("Close", 80, 26) then
          beam_close(win)
        end if
      beam_row_end()

    beam_group_end()

  beam_end(win)
wend
