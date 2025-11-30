export class CreateMessageDto {
  // either conversationId OR borrowRequestId can be used (we will use borrowRequestId)
  borrow_request_id?: number; // prefer this — conversation is created per borrow request
  conversation_id?: number;
  text: string;
}
