// ============================================================
// BEAM Calculator
// A 4-function (+ - * /) calculator with a numeric display.
// Click digit buttons to build a number, choose an operator,
// enter the second number, then press = for the result.
// C clears everything.  +/- toggles sign.
// ============================================================

win = beam_open(320, 480, "Calculator")

display$  = "0"
accum     = 0
pending$  = ""
fresh     = 1

sub append_digit(d$)
  if fresh then
    if d$ = "." then
      display$ = "0."
    else
      display$ = d$
    end if
    fresh = 0
  else
    // prevent multiple decimal points
    if d$ = "." then
      if instr(display$, ".") = 0 then
        display$ = display$ + "."
      end if
    else
      if display$ = "0" then
        display$ = d$
      else
        display$ = display$ + d$
      end if
    end if
  end if
end sub

sub apply_op()
  if pending$ = "" then
    return
  end if
  cur = val(display$)
  if pending$ = "+" then
    accum = accum + cur
  elseif pending$ = "-" then
    accum = accum - cur
  elseif pending$ = "*" then
    accum = accum * cur
  elseif pending$ = "/" then
    if cur <> 0 then
      accum = accum / cur
    else
      accum = 0
      display$ = "Error"
      pending$ = ""
      fresh = 1
      return
    end if
  end if
  // format result: drop trailing .0 for whole numbers
  if accum = int(accum) then
    display$ = str$(int(accum))
  else
    display$ = str$(accum)
  end if
  fresh = 1
end sub

while beam_running(win)
  beam_begin(win)

    // --- Display ---
    // Wrap in an explicit beam_row so this group gets a fixed height and
    // does not consume all remaining space before the Keypad group renders.
    beam_row(80, 1)
      beam_group_begin("Display")
        beam_row(40, 1)
          beam_label(display$)
        beam_row_end()
      beam_group_end()
    beam_row_end()

    beam_spacing(4)

    // --- Button grid ---
    beam_group_begin("Keypad")

      // Row 1: C  +/-  (blank)  /
      beam_row(44, 4)
        if beam_button("C", 62, 40) then
          display$ = "0"
          accum = 0
          pending$ = ""
          fresh = 1
        end if
        if beam_button("+/-", 62, 40) then
          if display$ <> "0" and display$ <> "Error" then
            if left$(display$, 1) = "-" then
              display$ = right$(display$, len(display$) - 1)
            else
              display$ = "-" + display$
            end if
          end if
        end if
        beam_label("")
        if beam_button("/", 62, 40) then
          apply_op()
          accum = val(display$)
          pending$ = "/"
          fresh = 1
        end if
      beam_row_end()

      // Row 2: 7  8  9  *
      beam_row(44, 4)
        if beam_button("7", 62, 40) then append_digit("7") end if
        if beam_button("8", 62, 40) then append_digit("8") end if
        if beam_button("9", 62, 40) then append_digit("9") end if
        if beam_button("*", 62, 40) then
          apply_op()
          accum = val(display$)
          pending$ = "*"
          fresh = 1
        end if
      beam_row_end()

      // Row 3: 4  5  6  -
      beam_row(44, 4)
        if beam_button("4", 62, 40) then append_digit("4") end if
        if beam_button("5", 62, 40) then append_digit("5") end if
        if beam_button("6", 62, 40) then append_digit("6") end if
        if beam_button("-", 62, 40) then
          apply_op()
          accum = val(display$)
          pending$ = "-"
          fresh = 1
        end if
      beam_row_end()

      // Row 4: 1  2  3  +
      beam_row(44, 4)
        if beam_button("1", 62, 40) then append_digit("1") end if
        if beam_button("2", 62, 40) then append_digit("2") end if
        if beam_button("3", 62, 40) then append_digit("3") end if
        if beam_button("+", 62, 40) then
          apply_op()
          accum = val(display$)
          pending$ = "+"
          fresh = 1
        end if
      beam_row_end()

      // Row 5: 0 (wide)  .  =
      beam_row(44, 4)
        if beam_button("0", 62, 40) then append_digit("0") end if
        if beam_button(".", 62, 40) then append_digit(".") end if
        beam_label("")
        if beam_button("=", 62, 40) then
          if pending$ <> "" then
            apply_op()
            pending$ = ""
          end if
        end if
      beam_row_end()

    beam_group_end()

  beam_end(win)
wend
