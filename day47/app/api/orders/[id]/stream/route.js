import { getSession } from "@/lib/session";
import { getOrderAs } from "@/lib/db";

export const dynamic = "force-dynamic";

const TERMINAL = ["delivered", "cancelled"];
const encoder = new TextEncoder(); // streams carry bytes, not strings

export async function GET(request, { params }) {
  const { id } = await params;
  const user = await getSession();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!getOrderAs(user, id)) return Response.json({ error: "Not found" }, { status: 404 });

  let timer;
  const stream = new ReadableStream({
    start(controller) {
      let last;
      let closed = false;

      const stop = () => {
        if (closed) return;
        closed = true;
        clearInterval(timer);
        try { controller.close(); } catch {}
      };
      const write = (text) => { if (!closed) controller.enqueue(encoder.encode(text)); };

      const tick = () => {
        const order = getOrderAs(user, id);
        if (!order) return stop();
        if (order.status !== last) {
          last = order.status;
          write(`data: ${JSON.stringify({ id, status: order.status })}\n\n`); // two newlines
        } else {
          write(": ping\n\n"); // comment line keeps proxies from idling out
        }
        if (TERMINAL.includes(order.status)) stop(); // close deliberately
      };

      write("retry: 3000\n\n");
      tick();
      if (!closed) timer = setInterval(tick, 2000);
      request.signal.addEventListener("abort", stop); // tab closed or navigated away
    },
    cancel() { clearInterval(timer); },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
