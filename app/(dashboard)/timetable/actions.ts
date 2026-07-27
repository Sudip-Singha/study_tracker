"use server";

import { revalidatePath } from "next/cache";
import { createTimeBlock, createMultipleTimeBlocks, updateTimeBlock, deleteTimeBlock, type TimeBlockInsert, type TimeBlockUpdate } from "@/services/timetable.service";

export async function createTimeBlockAction(input: TimeBlockInsert) {
  await createTimeBlock(input);
  revalidatePath("/timetable");
}

export async function createMultipleTimeBlocksAction(inputs: TimeBlockInsert[]) {
  await createMultipleTimeBlocks(inputs);
  revalidatePath("/timetable");
}

export async function updateTimeBlockAction(id: string, input: TimeBlockUpdate) {
  await updateTimeBlock(id, input);
  revalidatePath("/timetable");
}

export async function deleteTimeBlockAction(id: string) {
  await deleteTimeBlock(id);
  revalidatePath("/timetable");
}
