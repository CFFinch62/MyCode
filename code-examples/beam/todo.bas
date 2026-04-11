' ============================================================
' BEAM To-Do List
' Add items by typing in the input field and pressing Add
' (or Enter).  Remove any item with its Delete button.
' Up to 50 items are supported.
' ============================================================

win  = beam_open(480, 520, "To-Do List")

MAX_ITEMS = 50
dim items$(MAX_ITEMS)
count    = 0
newitem$ = ""
msg$     = ""

' Add a new item to the list
sub add_item()
  if newitem$ = "" then
    msg$ = "Please enter some text first."
    return
  end if
  if count >= MAX_ITEMS then
    msg$ = "List is full (50 items max)."
    return
  end if
  items$(count) = newitem$
  count = count + 1
  newitem$ = ""
  msg$ = "Item added. (" + str$(count) + " total)"
end sub

' Remove item at index idx (0-based), shift array down
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

    beam_group_begin("New Item")
      beam_row(30, 1)
        if beam_input(newitem$, 128, 440) then
          ' input changed — clear status message
          msg$ = ""
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

    beam_spacing(6)

    beam_group_begin("Items (" + str$(count) + ")")
      if count = 0 then
        beam_spacing(8)
        beam_label("No items yet.  Add one above.")
        beam_spacing(8)
      else
        ' Scrollable panel for the list
        beam_panel_begin("List", 440, 340)
          i = 0
          while i < count
            beam_row(28, 2)
              beam_label(str$(i + 1) + ". " + items$(i))
              if beam_button("Delete##" + str$(i), 70, 24) then
                remove_item(i)
                ' restart loop from same index (items shifted)
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
