import { Send } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

interface ChatInputProps {
  disabled?: boolean;
}

const ChatInput = ({ disabled }: ChatInputProps) => {
  return (
    <div className="absolute bottom-0 left-0 w-full">
      <form
        action=""
        className="mx-2 flex gap-3 md:mx-4 md:last:mb-6 lg:mx:max-w-2xl xl:max-w-3xl"
      >
        <div className="relative flex h-full flex-1 items-stretch md:flex-col">
          <div className="relative flex flex-col w-full flex-grow p-4">
            <div className="relative ">
              <Textarea
                rows={1}
                maxRows={4}
                placeholder="Enter your question"
                className="resize-none pr-12 text-base py-3 scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2"
              />
              <Button className="absolute bottom-1.5 right-[8px]">
                <Send className="h-4 w-4" aria-label="send message" />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
