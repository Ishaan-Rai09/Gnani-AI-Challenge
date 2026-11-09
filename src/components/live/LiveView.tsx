"use client";

import { useState } from "react";
import { ScenarioPicker } from "@/components/app/ScenarioPicker";
import { IdleLive } from "@/components/live/IdleLive";
import { IncomingCall } from "@/components/live/IncomingCall";
import { ScreeningRoom } from "@/components/live/ScreeningRoom";
import { SessionSummary } from "@/components/live/SessionSummary";
import { getScenario } from "@/lib/scenarios";
import { useCallShield } from "@/lib/store";

export function LiveView() {
  const {
    session,
    assistant,
    answerWithAI,
    declineCall,
    takeOver,
    sendUserMessage,
    allowCaller,
    endCall,
    blockCaller,
    dismissSession,
  } = useCallShield();
  const [pickerOpen, setPickerOpen] = useState(false);

  const scenario = session ? getScenario(session.scenarioId) : undefined;

  let content = <IdleLive onOpenPicker={() => setPickerOpen(true)} />;

  if (session && scenario) {
    if (session.phase === "ringing") {
      content = (
        <IncomingCall
          session={session}
          scenario={scenario}
          screeningEnabled={assistant.screeningEnabled}
          onAnswer={answerWithAI}
          onDecline={declineCall}
        />
      );
    } else if (session.phase === "ended") {
      content = (
        <SessionSummary
          session={session}
          scenario={scenario}
          onRestart={() => {
            dismissSession();
            setPickerOpen(true);
          }}
        />
      );
    } else {
      content = (
        <ScreeningRoom
          session={session}
          scenario={scenario}
          onTakeOver={takeOver}
          onAllow={allowCaller}
          onEnd={endCall}
          onBlock={blockCaller}
          onSend={sendUserMessage}
        />
      );
    }
  }

  return (
    <>
      {content}
      <ScenarioPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
}
