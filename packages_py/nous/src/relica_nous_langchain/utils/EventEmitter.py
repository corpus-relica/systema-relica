class EventEmitter:
    def __init__(self):
        self._events = {}

    def on(self, event, func):
        print("/// ON EVENT: ", event)
        if event not in self._events:
            self._events[event] = []
        self._events[event].append(func)

    def off(self, event, func):
        if event in self._events:
            self._events[event].remove(func)

    def emit(self, event, *args, **kwargs):
        if event in self._events:
            print("EMITTING EVENT: ", event)
            for func in self._events[event]:
                func(*args, **kwargs)

