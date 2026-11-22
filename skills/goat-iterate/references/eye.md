# Eyes: how to observe the real output

| Output | Eye | Tooling |
|---|---|---|
| Web page, UI, 3D, game | render headless, screenshot every state that matters, open each image | playwright / browser_exec |
| Code, script, library | run the tests, then run the program on real input; read output and errors | the project's test command |
| API, backend | call each endpoint; check status, body and logs | curl, httpx |
| Writing | reread as the target reader; trace every claim to a source; compare structure with the spec | |
| Data, analysis | recompute every headline number a second way and compare; open the output file | python |
| Slides, PDF, documents | render each page to an image and look at each one | pdf / pptx skills |
| Video, audio | extract frames at key times, or a transcript, and check them | ffmpeg via terminal |
| Research | trace each fact to a primary source; mark what was not found | web_search, web_extract |

Source (code, markup, your own text) shows intent; the eye shows outcome. Something present in source but not visible through the eye is UNSEEN, scored as absent.
