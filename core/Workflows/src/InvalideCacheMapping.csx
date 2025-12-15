using System;
using System.Threading.Tasks;
using BBT.Workflow.Scripting;
using BBT.Workflow.Definitions;

public class InvalidateCacheMapping : IMapping
{
    public Task<ScriptResponse> InputHandler(WorkflowTask task, ScriptContext context)
    {
        var daprTask = task as DaprPubSubTask;
        var pubsubName = Environment.GetEnvironmentVariable("DAPR_PUBSUB_BROADCAST_STORE_NAME");
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");

        daprTask.SetPubSubName(pubsubName);
        daprTask.SetTopic(daprTask.Topic.Replace("{ENVIRONMENT}", environment).ToLowerInvariant());
        
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