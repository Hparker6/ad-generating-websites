import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "../src/structured-data.ts";

// Constructed, not written literally: a raw U+2028/U+2029 in source is a line
// terminator and would break this file the same way it breaks a JSON-LD block.
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);

/**
 * Structured data is written into the page with Astro's `set:html`, which does
 * not escape anything. JSON.stringify leaves `<` and `>` intact, so a value
 * containing `</script>` would terminate the tag and turn the remainder into
 * HTML. These assert the sink is safe regardless of what reaches it.
 */
describe("serializeJsonLd", () => {
  it("escapes a closing script tag so it cannot break out", () => {
    const out = serializeJsonLd({ name: "</script><img src=x onerror=alert(1)>" });
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
    expect(out).toContain("\\u003c");
  });

  it("escapes case variants and spacing tricks", () => {
    for (const payload of ["</SCRIPT>", "</script >", "</script>", "<!--", "-->"]) {
      const out = serializeJsonLd({ name: payload });
      expect(out).not.toContain("<");
      expect(out).not.toContain(">");
    }
  });

  it("escapes U+2028 and U+2029, which are raw line terminators in JS", () => {
    const out = serializeJsonLd({ name: "a" + LS + "b" + PS + "c" });
    expect(out).toContain("\\u2028");
    expect(out).toContain("\\u2029");
    expect(out).not.toContain(LS);
    expect(out).not.toContain(PS);
  });

  it("escapes ampersands", () => {
    expect(serializeJsonLd({ name: "Pricing & Profit" })).toContain("\\u0026");
  });

  it("still parses back to exactly the same object", () => {
    const entry = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Break-Even Calculator </script> & <b>bold</b>",
      nested: { list: [1, 2, "a" + LS + "b"] },
    };
    expect(JSON.parse(serializeJsonLd(entry))).toEqual(entry);
  });

  it("produces valid JSON for ordinary content", () => {
    const entry = { "@type": "Organization", name: "Acme Ltd", url: "https://example.com/" };
    expect(JSON.parse(serializeJsonLd(entry))).toEqual(entry);
  });
});
