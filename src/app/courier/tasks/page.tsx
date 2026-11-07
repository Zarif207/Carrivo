import { redirect } from "next/navigation";

/** /courier/tasks has no page of its own: the task list is the courier home. */
export default function TasksIndex() {
  redirect("/courier");
}
