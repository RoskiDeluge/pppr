# Exploring local IPC and why it fits `pi`

## Why this artifact exists
This note explains what local IPC is in practical terms and why a project like `pi` would likely prefer it for certain integrations or runtime coordination.

This artifact includes both:

- direct observations about local IPC as a technical mechanism
- inference about why `pi` would prefer it, based on the philosophy in [`what_i_learned.md`](./what_i_learned.md)

## What local IPC is
Local IPC means inter-process communication between programs running on the same machine.

Instead of talking over the public network, processes communicate through local operating system mechanisms such as:

- Unix domain sockets
- named pipes
- anonymous pipes
- shared memory
- local loopback connections such as `127.0.0.1`

In the `tsx` case we just hit, the runtime tried to create a local pipe/socket under the system temp directory so one local process could coordinate with another local process. That is IPC.

## Why local IPC exists
Local IPC is useful when one process needs to:

- start or supervise another process
- pass messages or commands internally
- coordinate state between a launcher and a worker
- avoid the cost and exposure of using a real network path

It is usually faster and more private than network communication because the traffic never leaves the local machine.

## Why `pi` would likely prefer it
This part is inference, but it fits the philosophy Mario describes in [`what_i_learned.md`](./what_i_learned.md).

`pi` consistently prefers:

- local-first operation
- minimal moving parts
- explicit observability
- boring, synchronous primitives
- avoiding heavyweight orchestration layers

Local IPC fits that worldview better than introducing a remote service boundary or a more elaborate daemon architecture.

## My read on the design preference
If `pi` needs coordination between local runtime pieces, local IPC is attractive because it is:

- local by default
- operationally simple compared to networked services
- fast enough for interactive CLI workflows
- easier to keep under direct user control
- compatible with "the terminal is the natural habitat" idea

That does not mean `pi` is "about IPC" as a product concept. It means local IPC is the kind of implementation detail that matches its bias toward direct host-native mechanisms instead of platform-heavy abstractions.

## Why this matters for `pppr`
For `pppr`, the lesson is not "add IPC everywhere."

The lesson is narrower:

- prefer host-native local coordination when a coordination mechanism is needed
- avoid remote or hidden orchestration unless it clearly buys something essential
- keep the runtime topology legible to the operator

So if `pppr` eventually needs process coordination, helper workers, or editor/runtime handoff, local IPC is philosophically aligned with the direction inherited from `pi`, provided it remains inspectable and does not turn into invisible infrastructure.

## Bottom line
Local IPC is just machine-local process-to-process communication.

My inference is that `pi` would prefer it because it reinforces the same values visible elsewhere in the project:

- keep things local
- keep them simple
- avoid unnecessary service layers
- stay close to the operating system and terminal
