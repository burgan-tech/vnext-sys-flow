using System.Threading.Tasks;
using BBT.Workflow.Scripting;
using BBT.Workflow.Definitions;

public class InvalidateCacheMapping : IMapping
{
    public Task<ScriptResponse> InputHandler(WorkflowTask task, ScriptContext context)
    {
        var daprTask = task as DaprPubSubTask;
        var appId = Environment.GetEnvironmentVariable("DAPR_APP_ID");

        daprTask.SetTopic(appId);
        
        daprTask.SetData(new
        {
            key = context.Instance.Key,
            flow = context.Workflow.Key,
            domain = context.Runtime.Domain,
            version = context.Instance.LatestData?.Version ?? "1.0.0"
        });
        return Task.FromResult(new ScriptResponse());
    }

    public Task<ScriptResponse> OutputHandler(ScriptContext context)
    {
        return Task.FromResult(new ScriptResponse());
    }
}