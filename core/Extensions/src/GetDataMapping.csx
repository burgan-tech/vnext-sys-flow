using System;
using System.Threading.Tasks;
using BBT.Workflow.Scripting;
using BBT.Workflow.Definitions;

public class GetDataMapping : IMapping
{
    public Task<ScriptResponse> InputHandler(WorkflowTask task, ScriptContext context)
    {
        return Task.FromResult(new ScriptResponse());
    }

    public Task<ScriptResponse> OutputHandler(ScriptContext context)
    {
        return Task.FromResult(new ScriptResponse()
        {
            Data = new
            {
                href = context.Runtime.Domain + "/workflows/" + context.Workflow.Key + "/instances/" + context.Instance.Id.ToString() + "/functions/data?async=false"
            }
        });
    }
}