// ============================================================
// BEAM Test Suite - Phase 4
// Exercises every command in the BEAM vocabulary (Section 3).
// Navigate with the Next / Prev buttons to step through tests.
//
// NOTE: yabasic does not allow inline if-then inside a block
// if-end if, so every if is written in multi-line form here.
// ============================================================

win = beam_open(640, 520, "BEAM Test Suite")

pages   = 9
page    = 1
msg$    = ""
inputbuf$ = "edit me"
chk1    = 0
chk2    = 1
slval   = 40
progval = 0
progmax = 100
comboidx = 0
openpath$ = ""
savepath$ = ""
combo_items$ = "Apple\nBanana\nCherry\nDate\nElder"
current_style$ = "dark"

while beam_running(win)
  beam_begin(win)

    beam_row(28, 3)
      beam_label("BEAM Test Suite")
      beam_label("Page " + str$(page) + " / " + str$(pages))
      if beam_button("Quit", 60, 24) then
        beam_close(win)
      end if
    beam_row_end()

    beam_separator()
    beam_spacing(4)

    if page = 1 then

      beam_group_begin("1: Window + Labels")
        beam_label("beam_open / beam_close / beam_running:")
        beam_label("  Window is open (beam_running returned 1).")
        beam_spacing(6)
        beam_label("beam_label renders static text.")
        beam_spacing(6)
        beam_label("beam_text with word-wrap:")
        beam_text("This is a longer string passed to beam_text(). It wraps inside the available column width without clipping.", 560, 50)
        beam_spacing(6)
        beam_label("beam_title - click to rename the window:")
        beam_row(28, 2)
          if beam_button("Set Title", 100, 24) then
            beam_title(win, "BEAM - title changed!")
          end if
          if beam_button("Reset Title", 110, 24) then
            beam_title(win, "BEAM Test Suite")
          end if
        beam_row_end()
      beam_group_end()

    elseif page = 2 then

      beam_group_begin("2: beam_button")
        beam_label("beam_button(label$, w, h) returns 1 if clicked.")
        beam_spacing(8)
        beam_row(34, 3)
          if beam_button("Red",   80, 30) then
            msg$ = "Red clicked"
          end if
          if beam_button("Green", 80, 30) then
            msg$ = "Green clicked"
          end if
          if beam_button("Blue",  80, 30) then
            msg$ = "Blue clicked"
          end if
        beam_row_end()
        beam_spacing(8)
        beam_label("Last click: " + msg$)
      beam_group_end()

    elseif page = 3 then

      beam_group_begin("3: beam_input + beam_checkbox")
        beam_label("beam_input - single-line text field:")
        beam_row(30, 1)
          r = beam_input(inputbuf$, 128, 400)
        beam_row_end()
        beam_label("Buffer: " + inputbuf$)
        beam_spacing(10)
        beam_label("beam_checkbox:")
        chk1 = beam_checkbox("Option A (off by default)", chk1)
        chk2 = beam_checkbox("Option B (on by default)",  chk2)
        beam_spacing(6)
        if chk1 then
          beam_label("  Option A is ON")
        else
          beam_label("  Option A is off")
        end if
        if chk2 then
          beam_label("  Option B is ON")
        else
          beam_label("  Option B is off")
        end if
      beam_group_end()

    elseif page = 4 then

      beam_group_begin("4: beam_combo + beam_slider")
        beam_label("beam_combo - dropdown list:")
        comboidx = beam_combo(combo_items$, 5, comboidx, 200, 25)
        beam_label("Selected index: " + str$(comboidx))
        beam_spacing(10)
        beam_label("beam_slider - drag to change value:")
        slval = beam_slider(slval, 0, 100, 1, 380)
        beam_label("Slider value: " + str$(slval))
      beam_group_end()

    elseif page = 5 then

      beam_group_begin("5: beam_progress + beam_separator + beam_spacing")
        beam_label("beam_progress:")
        beam_progress(progval, progmax, 400, 22)
        beam_row(28, 3)
          if beam_button("-10", 60, 24) then
            progval = progval - 10
            if progval < 0 then
              progval = 0
            end if
          end if
          if beam_button("+10", 60, 24) then
            progval = progval + 10
            if progval > progmax then
              progval = progmax
            end if
          end if
          beam_label(str$(progval) + " / " + str$(progmax))
        beam_row_end()
        beam_spacing(8)
        beam_label("beam_separator:")
        beam_separator()
        beam_label("(separator drawn above)")
        beam_spacing(12)
        beam_label("beam_spacing(12) left a 12 px gap above this line.")
      beam_group_end()

    elseif page = 6 then

      beam_label("6: beam_row + beam_group_begin/end")
      beam_spacing(4)
      beam_row(180, 2)
        beam_group_begin("Left column")
          beam_label("Inside left group.")
          beam_spacing(6)
          beam_label("Groups are created with")
          beam_label("beam_group_begin / beam_group_end.")
        beam_group_end()
        beam_group_begin("Right column")
          beam_label("Inside right group.")
          beam_spacing(6)
          beam_label("beam_row(h, cols) sets")
          beam_label("the column count.")
        beam_group_end()
      beam_row_end()

    elseif page = 7 then

      beam_group_begin("7: Dialogs")
        beam_label("beam_msgbox:")
        if beam_button("Show Msgbox", 120, 28) then
          r = beam_msgbox("Hello from BEAM", "This is beam_msgbox().\nClick OK to dismiss.")
        end if
        beam_spacing(8)
        beam_label("beam_confirm:")
        if beam_button("Ask Question", 120, 28) then
          ans = beam_confirm("Confirm", "Do you like BEAM?")
          if ans then
            msg$ = "You said YES!"
          else
            msg$ = "You said no."
          end if
        end if
        beam_label("Answer: " + msg$)
        beam_spacing(8)
        beam_label("beam_open_file / beam_save_file:")
        beam_row(28, 2)
          if beam_button("Open File...", 110, 24) then
            openpath$ = beam_open_file("*.bas|*.txt|BEAM source")
          end if
          if beam_button("Save File...", 110, 24) then
            savepath$ = beam_save_file("*.bas|BEAM source")
          end if
        beam_row_end()
        if openpath$ <> "" then
          beam_label("Opened: " + openpath$)
        end if
        if savepath$ <> "" then
          beam_label("Saving:  " + savepath$)
        end if
      beam_group_end()

    elseif page = 8 then

      beam_group_begin("8: beam_set_style + beam_set_color")
        beam_label("beam_set_style(name$) - switch theme:")
        beam_row(28, 3)
          if beam_button("Dark",  70, 24) then
            beam_set_style("dark")
            current_style$ = "dark"
          end if
          if beam_button("White", 70, 24) then
            beam_set_style("white")
            current_style$ = "white"
          end if
          if beam_button("Amber", 70, 24) then
            beam_set_style("amber")
            current_style$ = "amber"
          end if
        beam_row_end()
        beam_label("Current style: " + current_style$)
        beam_spacing(10)
        beam_label("beam_set_color(r,g,b) - accent colour override:")
        beam_row(28, 3)
          if beam_button("Red tint",   90, 24) then
            beam_set_color(200, 80, 80)
          end if
          if beam_button("Green tint", 90, 24) then
            beam_set_color(80, 200, 80)
          end if
          if beam_button("Reset",      70, 24) then
            beam_set_style(current_style$)
          end if
        beam_row_end()
      beam_group_end()

    elseif page = 9 then

      beam_group_begin("9: beam_time + beam_sleep")
        t = beam_time()
        beam_label("beam_time() = " + str$(t) + " ms since launch")
        beam_spacing(8)
        beam_label("beam_sleep(ms) - pauses execution:")
        if beam_button("Sleep 200ms", 120, 28) then
          t1 = beam_time()
          beam_sleep(200)
          t2 = beam_time()
          msg$ = "Slept " + str$(t2 - t1) + " ms"
        end if
        beam_label(msg$)
        beam_spacing(8)
        beam_label("All commands tested. Phase 4 complete on Linux!")
      beam_group_end()

    end if

    beam_spacing(6)
    beam_separator()

    beam_row(28, 3)
      if beam_button("< Prev", 70, 24) then
        page = page - 1
        if page < 1 then
          page = 1
        end if
        msg$ = ""
      end if
      beam_label("Use Prev / Next to navigate")
      if beam_button("Next >", 70, 24) then
        page = page + 1
        if page > pages then
          page = pages
        end if
        msg$ = ""
      end if
    beam_row_end()

  beam_end(win)
wend
