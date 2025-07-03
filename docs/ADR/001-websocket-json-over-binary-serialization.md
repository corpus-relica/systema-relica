# ADR-001: WebSocket JSON Communication Over Binary Serialization

**Date**: 2025-07-01  
**Status**: Accepted  
**Context**: PR #157 Performance Investigation  
**Decision**: Use JSON for all WebSocket communication, not binary serialization

## Context

We attempted to implement binary serialization (MessagePack) for WebSocket communication to achieve:
- 68% bandwidth reduction
- 3.5x speed improvement

These expectations were based on successful Nippy serialization in our previous Clojure implementation. However, we discovered that serialization benefits **do not translate across language ecosystems**:

- **Clojure/Nippy**: Native binary support, efficient JVM byte operations, seamless integration
- **TypeScript/MessagePack**: Required base64 encoding, JavaScript number arrays, Socket.IO limitations

The decision to proceed without proper testing was driven by confidence from the Clojure experience, but this proved to be a critical oversight.

## Decision

**We will use JSON for all WebSocket communication** between services and clients.

## Consequences

### Positive

1. **Better actual performance**
   - 17-21% smaller payloads than our binary implementation
   - 2.5-11x faster processing than our binary implementation
   - Native WebSocket compression (deflate) works optimally on JSON

2. **Simpler architecture**
   - No encoding/decoding layers
   - Direct browser compatibility
   - Human-readable debugging
   - Fewer failure points

3. **Developer experience**
   - Easy to inspect messages in browser DevTools
   - No special tooling needed
   - Clear error messages
   - Simpler testing

### Negative

1. **Theoretical inefficiency**
   - JSON is less space-efficient than binary formats in theory
   - However, our implementation proved theory != practice

2. **Lost optimization opportunity**
   - We cannot leverage binary protocol efficiency
   - But our attempt showed we couldn't achieve it anyway

## Technical Analysis

### Why Binary Serialization Failed

1. **Double encoding overhead**
   ```typescript
   // What we did (inefficient):
   JSON → msgpack → base64 → JSON wrapper → transmission
   
   // What Clojure/Nippy did (efficient):
   EDN → Nippy → raw bytes → transmission
   ```

2. **JavaScript limitations vs JVM strengths**
   - **JavaScript**: `Array.from(Uint8Array)` created massive overhead
   - **JVM**: Native byte[] arrays with zero-copy operations
   - **JavaScript**: Numbers always 64-bit floats
   - **JVM**: Efficient primitive types (byte, short, int, long)
   
3. **JSON optimization asymmetry**
   - **JavaScript/V8**: JSON is a first-class citizen with native C++ fast paths
     - `JSON.parse()`/`JSON.stringify()` are highly optimized native implementations
     - V8 has specific optimizations for JSON-like object shapes
     - Years of optimization for web workloads (which are JSON-heavy)
   - **Clojure/JVM**: JSON is just another data format
     - JSON parsing/serialization goes through generic libraries
     - EDN (Extensible Data Notation) is Clojure's native format
     - Less optimization effort spent on JSON specifically

4. **Framework constraints**
   - **Socket.IO**: Requires JSON or base64-encoded strings
   - **Clojure WebSockets**: Direct binary frame support
   - **Browser**: Limited binary handling without base64
   - **JVM**: Full binary protocol support

5. **The Nippy Advantage** (that we couldn't replicate)
   - Nippy leverages JVM's native binary capabilities
   - Tight integration with Clojure's data structures
   - No JSON intermediate representation needed
   - Direct memory-mapped operations possible

### Actual Performance Comparison

| Metric | JSON | Binary (msgpack+base64) | 
|--------|------|------------------------|
| Single Fact Size | 444 bytes | 535 bytes (+20.5%) |
| 10 Facts Size | 4,471 bytes | 5,255 bytes (+17.5%) |
| Encoding Speed | 7.13ms | 17-32ms (2.5-4.5x slower) |
| Complexity | Simple | Complex |
| Debugging | Easy | Hard |

## Lessons Learned

1. **Language ecosystems matter** - Clojure/JVM binary handling ≠ JavaScript/V8 binary handling
2. **Success doesn't translate** - What works in one stack may fail catastrophically in another
3. **Always prototype first** - Past success can create dangerous overconfidence
4. **Platform constraints dominate** - JavaScript's lack of true binary types forced inefficient workarounds
5. **Measure before optimizing** - Our optimization made things worse
6. **Consider the full stack** - Binary benefits were lost in transport layer
7. **Test real-world scenarios** - Lab results != production results

### Cross-Stack Translation Trap

This experience highlights a critical insight: **architectural patterns are not universally portable**. The same logical approach (binary serialization) had opposite results:

| Aspect | Clojure/Nippy | TypeScript/MessagePack |
|--------|---------------|------------------------|
| Binary Type | Native byte arrays | Uint8Array → Array conversion |
| Transport | Direct binary | Base64 encoding required |
| JSON Performance | Slower (library-based) | Blazing fast (native C++) |
| Binary Performance | Faster (JVM optimized) | Slower (JS limitations) |
| Native Format | EDN → Nippy efficient | JSON → anything else inefficient |
| Performance | Faster than Clojure JSON | 2.5-11x slower than JS JSON |
| Size | Smaller than Clojure JSON | 18-21% larger than JS JSON |
| Integration | Seamless | Complex workarounds |

The crucial insight: **Each platform has its "native" serialization format** where it excels:
- **JavaScript**: JSON is literally "JavaScript Object Notation" - deeply optimized
- **Clojure**: EDN/Nippy aligns with immutable data structures - naturally efficient

## Future Considerations

If we ever reconsider binary protocols:

1. **Use transport-level binary** - Not application-level encoding
2. **Avoid base64** - Use proper binary WebSocket frames
3. **Profile first** - Prove JSON is actually a bottleneck
4. **Consider alternatives**:
   - Protocol Buffers with proper binary transport
   - Native WebSocket binary frames (not Socket.IO)
   - HTTP/2 with binary streams

## References

- Original PR: #157
- Performance tests: Showed 18-21% size increase, 2.5-11x slowdown
- Implementation: `packages/websocket-contracts/src/utils/binary-serialization.util.ts` (removed)
- Analysis: `/BINARY-SERIALIZATION-REMOVAL.md`

## Decision

**JSON-only WebSocket communication is our standard.** Any future binary protocol proposals must:
1. Demonstrate actual (not theoretical) benefits
2. Use proper binary transport (not base64)
3. Show measurable improvements in production-like conditions
4. Consider total system complexity costs