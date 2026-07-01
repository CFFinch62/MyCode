// ============================================================
// BEAM To-Do List
// Add items by typing in the input field and pressing Add
// (or Enter).  Remove any item with its Delete button.
// Up to 50 items are supported.
// ============================================================

win  = beam_open(480, 600, "To-Do List")

MAX_ITEMS = 50
dim items$(MAX_ITEMS)
count    = 0
newitem$ = ""
msg$     = ""

// Add a new item to the list.
// beam_input$ is updated each frame by the C layer with the live contents
// of the Nuklear edit buffer.  Setting beam_input_clear = 1 requests the
// C layer to wipe the buffer on the next frame.
sub add_item()
  if beam_input$ = "" then
    msg$ = "Please enter some text first."
    return
  end if
  if count >= MAX_ITEMS then
    msg$ = "List is full (50 items max)."
    return
  end if
  items$(count) = beam_input$
  count = count + 1
  beam_input_clear = 1   // asks C to clear the edit field next frame
  msg$ = "Item added. (" + str$(count) + " total)"
end sub

// Remove item at index idx (0-based), shift array down
sub remove_item(idx)
  i = idx
  while i < count - 1
    items$(i) = items$(i + 1)
    i = i + 1
  wend
  items$(count - 1) = ""
  count = count - 1
  msg$ = str$(count) + " item(s) remaining."
end sub

while beam_running(win)
  beam_begin(win)

    // beam_row height = 18 (title) + 8+8 (padding) + 30 + 4 + 30 (rows+spacing) + 10 (margin) = 108 -> 110
    beam_row(110, 1)
    beam_group_begin("New Item")
      beam_row(30, 1)
        if beam_input(newitem$, 128, 440) then
          // Enter pressed — add immediately and clear the field
          add_item()
        end if
      beam_row_end()
      beam_row(30, 3)
        if beam_button("Add", 80, 26) then
          add_item()
        end if
        beam_label(msg$)
        if beam_button("Clear All", 90, 26) then
          ans = beam_confirm("Clear List", "Remove all " + str$(count) + " items?")
          if ans then
            count = 0
            msg$ = "List cleared."
          end if
        end if
      beam_row_end()
    beam_group_end()
    beam_row_end()

    beam_spacing(6)

    beam_group_begin("Items (" + str$(count) + ")")
      if count = 0 then
        beam_spacing(8)
        beam_label("No items yet.  Add one above.")
        beam_spacing(8)
      else
        // Scrollable panel for the list
        beam_panel_begin("List", 440, 340)
          i = 0
          while i < count
            beam_row(28, 2)
              beam_label(str$(i + 1) + ". " + items$(i))
              if beam_button("Delete##" + str$(i), 70, 24) then
                remove_item(i)
                // restart loop from same index (items shifted)
                i = i - 1
              end if
            beam_row_end()
            i = i + 1
          wend
        beam_panel_end()
      end if
    beam_group_end()

  beam_end(win)
wend
