"use client";

import { useMutation } from "@tanstack/react-query";
import { createContext, useState } from "react";
import { useToast } from "../ui/use-toast";

type StreamResponse = {
  addMessage: () => void;
  message: string;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
};

export const ChatContext = createContext<StreamResponse>({
  addMessage: () => {},
  message: "",
  handleInputChange: () => {},
  isLoading: false,
});

export const ChatContextProvider = ({
  fileId,
  children,
}: {
  fileId: string;
  children: React.ReactNode;
}) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      const response = await fetch("/api/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId,
          message,
        }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.body;
    },

    // onSuccess: () => {
    //     toast({
    //         title: "Message sent",
    //         description: "Your message has been sent",
    //     })
    // },
    // onError: () => {
    //     toast({
    //         title: "Message not sent",
    //         description: "Your message could not be sent"
    //     })
    // },
  });

  const addMessage = () => {
    sendMessage({ message });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };
  return (
    <ChatContext.Provider
      value={{
        addMessage,
        message,
        handleInputChange,
        isLoading: false,
      }}
    ></ChatContext.Provider>
  );
};
